from Judgment import Judgment, add_zones_to_paragraph_objects
import bilstm_crf
from bilstm_utils import id2word
from utils import check_sections_to_summarize, calculate_embeddings
from lex_rank import lex_rank_emb


def usage_one_doc(doc_name, file_extension, italic=True, sections_to_summarize=["relatório", "fundamentação de facto", "fundamentação de direito"], sections_returned=["fundamentação de direito"]):
    paragraph_ids = []

    #define file extension
    if file_extension == ".docx":
        type = "docx"
    elif file_extension == ".txt":
        type = "text"
    elif file_extension == ".html":
        type = "html"

    # receives an judgment and divide the paragraphs into zones
    output, doc = get_sections(doc_name, type, italic)

    sections_to_summarize, section_added = check_sections_to_summarize(output, sections_to_summarize, sections_returned)

    if section_added:
        if section_added not in sections_returned:
            sections_returned.append(section_added)

    # add these zones in the paragraphs object
    add_zones_to_paragraph_objects(output, doc)

    emb, considered_ids = calculate_embeddings(doc, type,
                                               model_name_bert="stjiris/bert-large-portuguese-cased-legal-tsdae-gpl-nli-sts-v0",
                                               sections=sections_to_summarize,
                                               device="cpu")  # -> ((len(paragraphs), 1024), paragraphs ids used)


    idx_ordered_by_score, scores = lex_rank_emb(emb)

    for idx in idx_ordered_by_score:
        paragraph_ids.append(considered_ids[idx])


    all_paragraphs, correspondet_zones = doc.get_best_paragraphs(paragraph_ids, output, scores)

    return all_paragraphs, scores







def get_sections(doc_name, type, italic, device="cpu"):
    doc = Judgment(doc_name, type, italic)

    model = bilstm_crf.BiLSTMCRF.load("JudgmentModel/model.pth", device)
    model.eval()
    all_text, ids, text_ids = doc.get_list_text()
    output = {"wrapper": "plaintext", "text": text_ids, "denotations": []}

    #secções pela ordem mais importante
    sections_doc = {"fundamentação de direito": [], "fundamentação de facto": [], "relatório": [], "decisão": [], "delimitação": [], "colectivo": [], "declaração": [], "cabeçalho": [], "foot-note": [], "título": []}
    sections = model.get_sections(all_text, device)
    #print(sections)
    sections = sections[0][1:-1]
    sections_names = []
    for tag in sections:
        sections_names.append(id2word(tag))

    for i, section in enumerate(sections_names):
        if section in ["B-cabeçalho", "I-cabeçalho"]:
            sections_doc["cabeçalho"].append((section, ids[i]))
        elif section in ["B-relatório", "I-relatório"]:
            sections_doc["relatório"].append((section, ids[i]))
        elif section in ["B-delimitação", "I-delimitação"]:
            sections_doc["delimitação"].append((section, ids[i]))
        elif section in ["B-fundamentação-facto", "I-fundamentação-facto"]:
            sections_doc["fundamentação de facto"].append((section, ids[i]))
        elif section in ["B-fundamentação-direito", "I-fundamentação-direito"]:
            sections_doc["fundamentação de direito"].append((section, ids[i]))
        elif section in ["B-decisão", "I-decisão"]:
            sections_doc["decisão"].append((section, ids[i]))
        elif section in ["B-colectivo", "I-colectivo"]:
            sections_doc["colectivo"].append((section, ids[i]))
        elif section in ["B-declaração", "I-declaração"]:
            sections_doc["declaração"].append((section, ids[i]))
        elif section in ["B-foot-note", "I-foot-note"]:
            sections_doc["foot-note"].append((section, ids[i]))
        elif section == "título":
            sections_doc["título"].append((section, ids[i]))

    id = 0
    for key, value in sections_doc.items():
        if len(value) != 0:
            if key in ["cabeçalho", "relatório", "delimitação", "fundamentação de facto", "fundamentação de direito", "decisão", "foot-note"]:
                output["denotations"].append(
                    {"id": id, "start": value[0][1][0], "end": value[-1][1][0], "start_char": value[0][1][1],
                     "end_char": value[-1][1][2], "type": key})
            else:
                zones = []
                for v in value:
                    zones.append(v[1])

                output["denotations"].append({"id": id, "zones": zones, "type": key})
            id += 1

    return output, doc


usage_one_doc("../IrisDataset/test_examples/teste.txt", ".txt")