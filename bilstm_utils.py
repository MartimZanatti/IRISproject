import torch
import pickle
from emb_models import load_bert_model


tag_vocab = {"pad": 0, "B-cabeçalho": 1, "I-cabeçalho": 2, "B-relatório": 3, "I-relatório": 4, "B-delimitação": 5, "I-delimitação" : 6, "B-fundamentação": 7, "I-fundamentação": 8, "B-decisão": 9,
             "I-decisão": 10, "B-colectivo": 11, "I-colectivo": 12, "B-declaração": 13, "I-declaração": 14, "título": 15, "B-foot-note": 16, "I-foot-note": 17, "start": 18, "end": 19}


def get_mask(tags, device):
    mask = torch.zeros((tags.shape[0], tags.shape[1]), device=device)
    for i,batch in enumerate(tags):
        for j,t in enumerate(batch):
            if t == 0:
                mask[i,j] = False
            else:
                mask[i, j] = True

    mask = mask.bool()
    return mask


def get_embeddings(docs, idxs, device, type="train"):
    X = torch.zeros((len(docs), len(docs[0]), 1024), device=device)
    if type == "train":
        for i, id in enumerate(idxs):
            try:
                file = open('data_model/train_emb.pickle', 'rb')
                data = pickle.load(file)
                emb = data[id]
            except:
                file = open('data_model/train_emb_2.pickle', 'rb')
                data = pickle.load(file)
                emb = data[id]
            X[i, 0:emb.size(0)] = emb

        return X

    elif type == "dev":
        file = open('data_model/dev_emb.pickle', 'rb')
        data = pickle.load(file)
    elif type == "train_dev":
        for i, id in enumerate(idxs):
            try:
                file = open('data_model/train_emb.pickle', 'rb')
                data = pickle.load(file)
                emb = data[id]
            except:
                try:
                    file = open('data_model/train_emb_2.pickle', 'rb')
                    data = pickle.load(file)
                    emb = data[id]
                except:
                    file = open('data_model/dev_emb.pickle', 'rb')
                    data = pickle.load(file)
                    emb = data[id]

            X[i, 0:emb.size(0)] = emb

        return X
    else:
        file = open('data_model/test_emb.pickle', 'rb')
        data = pickle.load(file)

    for i,id in enumerate(idxs):
        emb = data[id]
        X[i, 0:emb.size(0)] = emb

    return X


def create_embeddings_judgment(text, device):
    """
        text -> list of paragraphs shape: (1,len + 2)
    """
    model_name_bert = "stjiris/bert-large-portuguese-cased-legal-mlm-nli-sts-v1"
    model_emb = load_bert_model(model_name_bert, device)
    X = torch.zeros((1, len(text[0]), 1024), device=device)
    for i, p in enumerate(text[0]):
        emb = torch.from_numpy(model_emb.encode(p))
        if emb.sum().data == 0:
            X[0, i] = torch.from_numpy(model_emb.encode("UNK"))
        else:
            X[0, i] = emb
    return X


def id2word(tag, tag_vocab=tag_vocab):
    """ Transform a sentence or a list of sentences from int to str
    Args:
        origin: a sentence of type list[int], or a list of sentences of type list[list[int]]
        vocab: Vocab instance
    Returns:
        a sentence or a list of sentences represented with str
    """
    for key,value in tag_vocab.items():
        if value == tag:
            return key