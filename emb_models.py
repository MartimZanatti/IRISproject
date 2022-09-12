from gensim.models import Word2Vec


def load_word_2_vec(model_name):
    return Word2Vec.load(model_name)