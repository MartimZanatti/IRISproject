import os
import torch
from emb_models import load_bert_model
import shutil





def calculate_embeddings(doc, model_name_bert="stjiris/bert-large-portuguese-cased-legal-mlm-nli-sts-v1", sections=["fundamentação"], device="cpu"):
    considered_sections_text = []
    considered_sections_ids = []
    for p in doc.paragraphs:
        if p.zone in sections: #if the paragraph belong to the considered sections
            considered_sections_text.append(p.text.get_text())
            considered_sections_ids.append(p.id)

    if device == 'cuda':
        torch.cuda.set_device()


    model_emb = load_bert_model(model_name_bert, device)

    X = torch.zeros((len(considered_sections_text), 1024), device=device)

    for i,p in enumerate(considered_sections_text):
        emb = torch.from_numpy(model_emb.encode(p))  # -> (1024) -> X[i,j]

        if emb.sum().data == 0:
            print("unkown paragraph", p)
            X[i] = torch.from_numpy(model_emb.encode("UNK"))

        else:
            X[i] = emb



    return X, considered_sections_ids



def find_longest_section(denotations):
    longest_sequence = 0
    section = ""

    for d in denotations:
        if d["type"] in ["cabeçalho", "relatório", "delimitação", "fundamentação", "decisão", "foot-note"]:
            length = d["end"] - d["start"] + 1
            if length > longest_sequence:
                longest_sequence = length
                section = d["type"]
        else:
            length = len(d["zones"])
            if length > longest_sequence:
                longest_sequence = length
                section = d["type"]

    return section


def check_sections_to_summarize(output, sections, sections_returned):
    section_added = None
    denotations = output["denotations"]

    found_sections = []

    for d in denotations:
        found_sections.append(d["type"])

    intersection_sections = [value for value in sections if value in found_sections]

    sections_returned_found = [value for value in sections_returned if value in intersection_sections]

    if intersection_sections == [] or sections_returned_found == []:
        section = find_longest_section(denotations)
        sections.append(section)
        section_added = section
        return sections, section_added
    else:
        return sections, section_added



def get_chars_by_id(id, text):
    for t in text:
        if t[1] == id:
            return t[2], t[3]
