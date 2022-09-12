from emb_models import load_word_2_vec
from pre_processing import check_bad_sentences_division
import torch
import torch.nn as nn
from vector_emb_calculus import vector_emb_calculus
import gensim

# embeddings usando word_2_vec


model_name = "word2vec.model"
emb_model = load_word_2_vec(model_name)


def join_all_stanza_sentences(paragraphs):
    stanza_sentences = [] # lista com as sentences dos paragrafos todas juntas
    ids_list = {} # dicionario onde a chave é o id do paragrafo e tem uma lista com os ids das frases contidas no paragrafo
    sentence_id = 1
    for p in paragraphs:
        if p.sumarizable == True:
            ids_list[str(p.paragraph_id)] = []
            for s in list(p.stanza_text.sentences):
                ids_list[str(p.paragraph_id)].append(sentence_id)
                stanza_sentences.append(s)
                sentence_id += 1
    return stanza_sentences, ids_list

def stanza_list_of_sentences(stanza_sentences):
    stanza_text = []
    for sentence in stanza_sentences:
        text = ''
        for word in sentence.words:
            text += word.lemma + ' '
        if not check_bad_sentences_division(text):
            stanza_text.append(text)
    return stanza_text




def create_sim_matrix_word_2_vec(paragraphs):
    stanza_sentences, ids_list = join_all_stanza_sentences(paragraphs)
    stanza_text = stanza_list_of_sentences(stanza_sentences)
    similarity_matrix = torch.empty(len(stanza_text), len(stanza_text))
    cos = nn.CosineSimilarity(dim=0, eps=1e-8)
    vector_dict = {}
    for i in range(len(stanza_text)):
        for j in range(len(stanza_text)):
            if str(i) not in vector_dict: # se ainda não tivermos a matrix da respectiva frase
                s1_vector = vector_emb_calculus(gensim.utils.simple_preprocess(stanza_text[i]), emb_model) #criamos um
                # objecto vector que vai buscar os emb de cada palavra e cria um emb da frase
                s1_vector.simple_multiplicative_model()
                vector_dict[str(i)] = s1_vector.vector #adiciona o vector ao dicionario
                s1_v = s1_vector.vector
            else:
                s1_v = vector_dict[str(i)]
            if str(j) not in vector_dict: #igual para o v2
                s2_vector = vector_emb_calculus(gensim.utils.simple_preprocess(stanza_text[j]), emb_model)
                s2_vector.simple_multiplicative_model()
                vector_dict[str(j)] = s2_vector.vector
                s2_v = s2_vector.vector
            else:
                s2_v = vector_dict[str(j)]

            similarity_matrix[i, j] = cos(s1_v, s2_v) # calcula a similaridade do cos entre os dois vectores e adiciona a matriz

    return similarity_matrix, stanza_sentences, ids_list


