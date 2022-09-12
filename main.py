import os
from main_functions import  process_docx_file, create_stanza_sentences

def main():
    path = '../IrisDataset/Expfinal/'
    files = os.listdir(path)
    for file_name in files:
        doc = process_docx_file(path + file_name)

    doc = create_stanza_sentences(doc)





if __name__ == "__main__":
    main()
