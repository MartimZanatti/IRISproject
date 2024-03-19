from gensim.models import Word2Vec
from sentence_transformers import SentenceTransformer

def load_word_2_vec(model_name):
    return Word2Vec.load(model_name)



def load_bert_model(model_name, device="cpu"):
    return SentenceTransformer(model_name, device)


