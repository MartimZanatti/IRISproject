import torch
from torch import nn
from bilstm_utils import get_mask, get_embeddings, create_embeddings_judgment
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence




class BiLSTMCRF(nn.Module):

    def __init__(
            self,
            tag_vocab,
            dropout_rate=0.5,
            embed_size=1024,
            hidden_size=1024,
            num_layers = 1
    ):
        super(BiLSTMCRF, self).__init__()

        self.dropout_rate = dropout_rate
        self.embed_size = embed_size
        self.hidden_size = hidden_size
        self.tag_vocab = tag_vocab
        self.num_layers = num_layers
        self.dropout = nn.Dropout(dropout_rate)
        self.encoder = nn.LSTM(input_size=embed_size, hidden_size=hidden_size, num_layers=num_layers, bidirectional=True)
        self.hidden2emit_score = nn.Linear(hidden_size * 2, len(self.tag_vocab))
        self.transition = nn.Parameter(torch.randn(len(self.tag_vocab), len(self.tag_vocab)))  # shape: (K, K)

    def forward(self, docs, tags, docs_length, idxs, device, type="train"):
        """
        Args:
            docs (list): documents, shape (b, len). Lengths are in decreasing order, len is the length
                                of the longest document
            tags (list): corresponding tags, shape (b, len)
            doc_lengths (list): documents lengths
        Returns:
            loss (tensor): loss on the batch, shape (b,)
        """

        tags = torch.LongTensor(tags).to(device)
        mask = get_mask(tags, device)


        docs_emb = get_embeddings(docs, idxs, device, type)
        docs_emb.transpose_(0,1)
        emit_score = self.encode(docs_emb, docs_length)
        loss = self.cal_loss(tags, mask, emit_score, device)  # shape: (b,)
        return loss

    def encode(self, docs, doc_lengths):
        """ BiLSTM Encoder
        Args:
            docs (tensor): docs with paragraphs embeddings, shape (len, b, e)
            doc_lengths (list): doc lengths
        Returns:
            emit_score (tensor): emit score, shape (b, len, K)
        """

        padded_docs = pack_padded_sequence(docs, doc_lengths)
        hidden_states, _ = self.encoder(padded_docs)
        hidden_states, _ = pad_packed_sequence(hidden_states, batch_first=True)  # shape: (b, len, 2h)
        emit_score = self.hidden2emit_score(hidden_states)  # shape: (b, len, K)
        emit_score = self.dropout(emit_score)  # shape: (b, len, K)
        return emit_score


    def cal_loss(self, tags, mask, emit_score, device):
        """ Calculate CRF loss
        Args:
            tags (tensor): a batch of tags, shape (b, len)
            mask (tensor): mask for the tags, shape (b, len), values in PAD position is 0
            emit_score (tensor): emit matrix, shape (b, len, K)
        Returns:
            loss (tensor): loss of the batch, shape (b,)
        """

        batch_size, doc_len = tags.shape
        # calculate score for the tags
        score = torch.gather(emit_score, dim=2, index=tags.unsqueeze(dim=2)).squeeze(dim=2)  # shape: (b, len)
        score[:, 1:] += self.transition[tags[:, :-1], tags[:, 1:]]
        total_score = (score * mask.type(torch.float)).sum(dim=1)  # shape: (b,)


        # calculate the scaling factor
        d = torch.unsqueeze(emit_score[:, 0], dim=1)  # shape: (b, 1, K)
        for i in range(1, doc_len):
            n_unfinished = mask[:, i].sum()
            d_uf = d[: n_unfinished]  # shape: (uf, 1, K)
            emit_and_transition = emit_score[: n_unfinished, i].unsqueeze(dim=1) + self.transition  # shape: (uf, K, K)
            log_sum = d_uf.transpose(1, 2) + emit_and_transition  # shape: (uf, K, K)
            max_v = log_sum.max(dim=1)[0].unsqueeze(dim=1)  # shape: (uf, 1, K)
            log_sum = log_sum - max_v  # shape: (uf, K, K)
            d_uf = max_v + torch.logsumexp(log_sum, dim=1).unsqueeze(dim=1)  # shape: (uf, 1, K)
            d = torch.cat((d_uf, d[n_unfinished:]), dim=0)
        d = d.squeeze(dim=1)  # shape: (b, K)
        max_d = d.max(dim=-1)[0]  # shape: (b,)
        d = max_d + torch.logsumexp(d - max_d.unsqueeze(dim=1), dim=1)  # shape: (b,)
        llk = total_score - d  # shape: (b,)
        loss = -llk  # shape: (b,)
        return loss


    def predict(self, docs, docs_lengths, idxs, real_tags, device, type="test"):
        """
        Args:
            docs (tensor): sentences, shape (b, len). Lengths are in decreasing order, len is the length
                                of the longest sentence
            docs_lengths (list): sentence lengths
        Returns:
            tags (list[list[str]]): predicted tags for the batch
        """

        real_tags = torch.LongTensor(real_tags).to(device)
        mask = get_mask(real_tags, device)
        docs_emb = get_embeddings(docs, idxs, device, type)
        batch_size = docs_emb.size(0)
        docs_emb = docs_emb.transpose(0, 1)  # shape: (len, b, e)
        emit_score = self.encode(docs_emb, docs_lengths)  # shape: (b, len, K)
        tags = [[[i] for i in range(len(self.tag_vocab))]] * batch_size  # list, shape: (b, K, 1)
        d = torch.unsqueeze(emit_score[:, 0], dim=1)  # shape: (b, 1, K)
        for i in range(1, docs_lengths[0]):
            n_unfinished = mask[:, i].sum()
            d_uf = d[: n_unfinished]  # shape: (uf, 1, K)
            emit_and_transition = self.transition + emit_score[: n_unfinished, i].unsqueeze(dim=1)  # shape: (uf, K, K)
            new_d_uf = d_uf.transpose(1, 2) + emit_and_transition  # shape: (uf, K, K)
            d_uf, max_idx = torch.max(new_d_uf, dim=1)
            max_idx = max_idx.tolist()  # list, shape: (nf, K)
            tags[: n_unfinished] = [[tags[b][k] + [j] for j, k in enumerate(max_idx[b])] for b in range(n_unfinished)]
            d = torch.cat((torch.unsqueeze(d_uf, dim=1), d[n_unfinished:]), dim=0)  # shape: (b, 1, K)
        d = d.squeeze(dim=1)  # shape: (b, K)
        _, max_idx = torch.max(d, dim=1)  # shape: (b,)
        max_idx = max_idx.tolist()
        tags = [tags[b][k] for b, k in enumerate(max_idx)]
        return tags

    def get_sections(self, all_text, device): # only for one document
        mask = torch.ones((1, len(all_text) + 2), device=device)
        mask = mask.bool() # shape: (1, len)
        all_text.insert(0,"START")
        all_text.append("END")
        all_text = [all_text] #shape (1,len + 3)
        docs_lengths = [len(all_text[0])]

        doc_emb = create_embeddings_judgment(all_text, device)
        doc_emb = doc_emb.transpose(0, 1)  # shape: (len, b, e)
        emit_score = self.encode(doc_emb, docs_lengths)  # shape: (b, len, K)
        tags = [[[i] for i in range(len(self.tag_vocab))]]  # list, shape: (b, K, 1)
        d = torch.unsqueeze(emit_score[:, 0], dim=1)  # shape: (b, 1, K)
        for i in range(1, docs_lengths[0]):
            n_unfinished = mask[:, i].sum()
            d_uf = d[: n_unfinished]  # shape: (uf, 1, K)
            emit_and_transition = self.transition + emit_score[: n_unfinished, i].unsqueeze(dim=1)  # shape: (uf, K, K)
            new_d_uf = d_uf.transpose(1, 2) + emit_and_transition  # shape: (uf, K, K)
            d_uf, max_idx = torch.max(new_d_uf, dim=1)
            max_idx = max_idx.tolist()  # list, shape: (nf, K)
            tags[: n_unfinished] = [[tags[b][k] + [j] for j, k in enumerate(max_idx[b])] for b in range(n_unfinished)]
            d = torch.cat((torch.unsqueeze(d_uf, dim=1), d[n_unfinished:]), dim=0)  # shape: (b, 1, K)
        d = d.squeeze(dim=1)  # shape: (b, K)
        _, max_idx = torch.max(d, dim=1)  # shape: (b,)
        max_idx = max_idx.tolist()
        tags = [tags[b][k] for b, k in enumerate(max_idx)]
        return tags


    def save(self, filepath):
        params = {
            'tag_vocab': self.tag_vocab,
            'args': dict(dropout_rate=self.dropout_rate, embed_size=self.embed_size, hidden_size=self.hidden_size, num_layers=self.num_layers),
            'state_dict': self.state_dict()
        }
        torch.save(params, filepath)

    @staticmethod
    def load(filepath, device_to_load):
        params = torch.load(filepath, map_location=lambda storage, loc: storage)
        model = BiLSTMCRF(params['tag_vocab'], **params['args'])
        model.load_state_dict(params['state_dict'])
        model.to(device_to_load)
        return model
