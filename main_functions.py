from  doc_class import doc_class, create_paragraph_stanza
from pre_processing import  find_final_data, is_title, before_italic_and_small_paragraphs
from embeddings import create_sim_matrix_word_2_vec
from lex_rank import degree_centrality_scores
from pos_processing import create_dict_scores, get_paragraphs

def process_docx_file(file_name):

    d = doc_class(file_name)
    # pre-processamento para limitar as frases sumarizaveis
    find_final_data(d.paragraphs)
    is_title(d.paragraphs)
    before_italic_and_small_paragraphs(d.paragraphs)

    return d

def create_stanza_sentences(doc):
    for p in doc.paragraphs:
        if p.sumarizable == True:
            nlp_paragraph = create_paragraph_stanza(p.text.get_text())
            p.stanza_text = nlp_paragraph
    return doc

def summarization(doc):

    similarity_matrix, ids_dict = create_sim_matrix_word_2_vec(doc.paragraphs)
    scores = degree_centrality_scores(similarity_matrix.numpy(), threshold=None)

    print(ids_dict)
    return scores, ids_dict


def pos_processing_paragraphs(paragraphs, scores, ids_dict):

    paragraphs_scores = create_dict_scores(scores, ids_dict)
    paragraphs = get_paragraphs(paragraphs, paragraphs_scores)

    return paragraphs


