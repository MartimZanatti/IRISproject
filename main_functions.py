from  doc_class import doc_class, create_paragraph_stanza
from pre_processing import  find_final_data, is_title, before_italic_and_small_paragraphs
from embeddings import create_sim_matrix_word_2_vec
from lex_rank import degree_centrality_scores

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

    similarity_matrix, stanza_sentences, ids_list = create_sim_matrix_word_2_vec(doc.paragraphs)
    scores = degree_centrality_scores(similarity_matrix.numpy(), threshold=None)




