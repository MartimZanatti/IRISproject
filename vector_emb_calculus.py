import torch
from gensim.models import Word2Vec

class vector_emb_calculus:

    def __init__(self, words, model):
        self.words = words  # a list of words
        self.model = model

    def __len__(self, item):
        return len(item)

    def simple_multiplicative_model(self):
        if len(self.words) == 1: # se for so uma palavra
            try:
                out = torch.FloatTensor(self.model.wv[self.words[0]]) #tenta ver se o embedding existe
            except:
                out = torch.zeros(100) #caso não fica a zeros
        else:
            out = torch.zeros(100) # cria um vector de zeros
            for i in range(len(self.words) - 1):
                try:
                    m1 = torch.FloatTensor(self.model.wv[self.words[i]]).unsqueeze(0)
                    m2 = torch.FloatTensor(self.model.wv[self.words[i + 1]]).unsqueeze(0)
                except:
                    continue

                aux_out = torch.logsumexp(m1, dim=0) + torch.logsumexp(m2, dim=0) #soma de logaritmos entre m1 e m2 (dois vectores de 100)
                out = out.unsqueeze(0)
                out = torch.logsumexp(out, dim=0) + torch.logsumexp(aux_out.unsqueeze(0), dim=0) #adiciona o resultado do aux ao out

        # print("out", out)
        self.vector = out