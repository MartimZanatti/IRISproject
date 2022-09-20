import numpy as np

from doc_class import get_text_by_id

def create_dict_scores(scores, ids_dict):
    paragraphs_scores = {}
    for key, value in ids_dict.items():
        score_aux = 0
        num_sentences = 0
        for id in value:
            num_sentences += 1
            score_aux += scores[int(id) - 1]

        score_paragraph = score_aux / num_sentences
        paragraphs_scores[key] = score_paragraph

    return paragraphs_scores


def get_paragraphs(paragraphs, paragraphs_scores):
    all_paragraphs = []
    for p in paragraphs:
        if str(p.id) in paragraphs_scores:
            all_paragraphs.append([p.text, paragraphs_scores[str(p.id)]])
        else:
            all_paragraphs.append([p.text])

    return all_paragraphs


def get_n_best_paragraphs(paragraphs, paragraphs_scores, n_best):

    final_paragraphs = []

    paragraphs_sorted = sorted(paragraphs_scores.items(), key=lambda x: x[1], reverse=True) # uma lista de tuplos ordenada pelo score dos paragrafos -> (id_paragrafo, score)

    #print(paragraphs_sorted)

    chosen_paragraphs = paragraphs_sorted[0:n_best] # uma lista de tuplos dos n melhores paragrafos

    #print(chosen_paragraphs)

    chosen_paragraphs_ordered_by_appearence = sorted(chosen_paragraphs, key=lambda x: x[0]) # uma lista de tuplos ordenada por ordem de aparecimento no acordao da primeira frase a aparecer no acrodao a ultimo -> (p_id, score)

    #print(chosen_paragraphs_ordered_by_appearence)

    for chosen_paragraph in chosen_paragraphs_ordered_by_appearence:
        final_paragraphs.append(get_text_by_id(paragraphs, chosen_paragraph[0]))

    return final_paragraphs





