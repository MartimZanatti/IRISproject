
from embeddings import get_stanza_text

class rouge_evalator:

    def __init__(self, hyp_sum, real_sum):
        self.hyp_sum = hyp_sum
        self.real_sum = real_sum
        self.hyp_grams = []
        self.real_grams = []
        self.hyp_vectors = []
        self.real_vectors = []
        self.score = 0

    def add_hyp_gram(self, value):
        self.hyp_grams.append(value)

    def add_real_gram(self, value):
        self.real_grams.append(value)


def stanza_to_text(paragraphs):
    all_text = ''
    for p in paragraphs:
        for s in list(p.stanza_text.sentences):
            text = get_stanza_text(s)
            if text:
                all_text += text + ' '

    return [all_text]