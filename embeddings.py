from emb_models import load_word_2_vec, load_bert_model
from pre_processing import check_bad_sentences_division
import torch
import torch.nn as nn
from vector_emb_calculus import vector_emb_calculus
import gensim

# embeddings usando word_2_vec


model_name_word2vec = "word2vec.model"
emb_model = load_word_2_vec(model_name_word2vec)

model_name_bert = 'rufimelo/Legal-SBERTimbau-sts-large-v2'



def join_all_stanza_sentences(paragraphs):
    ids_dict = {} # dicionario onde a chave é o id do paragrafo e tem uma lista com os ids das frases contidas no paragrafo
    sentence_id = 1
    stanza_text = []
    for p in paragraphs:
        if p.sumarizable == True:
            ids_dict[str(p.id)] = []
            for s in list(p.stanza_text.sentences):
                text = get_stanza_text(s)
                if text:
                    stanza_text.append(text)
                    ids_dict[str(p.id)].append(sentence_id)
                    sentence_id += 1
    return stanza_text, ids_dict

def get_stanza_text(sentence):
    text = ''
    for word in sentence.words:
        text += word.lemma + ' '
    if not check_bad_sentences_division(text):
        return text
    else:
        return False

def create_sim_matrix_word_2_vec(paragraphs):
    stanza_text, ids_list = join_all_stanza_sentences(paragraphs)
    #print("Stanza_senteces", len(stanza_sentences))
    #print("stanza_text", len(stanza_text))
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

    return similarity_matrix, ids_list

def create_sim_matrix_bert(paragraphs):
    stanza_text, ids_list = join_all_stanza_sentences(paragraphs)
    similarity_matrix = torch.empty(len(stanza_text), len(stanza_text))
    cos = nn.CosineSimilarity(dim=0, eps=1e-8)
    vector_dict = {}
    model = load_bert_model(model_name_bert)
    for i in range(len(stanza_text)):
        for j in range(len(stanza_text)):
            if str(i) not in vector_dict:  # se ainda não tivermos a matrix da respectiva frase
                vec1 = model.encode(stanza_text[i])
                vector_dict[str(i)] = vec1
            else:
                vec1 = vector_dict[str(i)]
            if str(j) not in vector_dict: #igual para o v2
                vec2 = model.encode(stanza_text[j])
                vector_dict[str(j)] = vec2
            else:
                vec2 = vector_dict[str(j)]

            vec1_tensor = torch.from_numpy(vec1)
            vec2_tensor = torch.from_numpy(vec2)

            similarity_matrix[i, j] = cos(vec1_tensor, vec2_tensor)  # calcula a similaridade do cos entre os dois vectores e adiciona a matriz

    return similarity_matrix, ids_list
