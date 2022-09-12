import os
from main_functions import  process_docx_file, create_stanza_sentences, summarization, pos_processing_paragraphs

def main():
    path = '../IrisDataset/Expfinal/'
    files = os.listdir(path)
    for file_name in files:
        doc = process_docx_file(path + file_name)

    doc = create_stanza_sentences(doc)

    scores, ids_dict = summarization(doc)

    pos_processing_paragraphs(doc.paragraphs,scores, ids_dict)





if __name__ == "__main__":
    main()
