import os
from main_functions import  process_docx_file, create_stanza_sentences, summarization, pos_processing_paragraphs, process_sum_to_files, rouge_main, box_plot_main

def main():

    """
    path = '../IrisDataset/Acordaos/20210309_1sec/'
    #path = '../IrisDataset/exp/'
    files = os.listdir(path)
    for file_name in files:
        print(file_name)
        doc = process_docx_file(path + file_name)
        doc = create_stanza_sentences(doc)
        scores, ids_dict = summarization(doc)

        #paragraphs = pos_processing_paragraphs(doc.paragraphs, scores, ids_dict)

        "para efeitos de correr varios e po-los em ficheiros usar esta funcão"

        process_sum_to_files(doc.paragraphs, scores, ids_dict, file_name, 5)

    """

    #rouge_main(['../IrisDataset/automatic_sumaries/20201202_1sec_bert/', '../IrisDataset/automatic_sumaries/20201202_1sec_bert2/', '../IrisDataset/automatic_sumaries/20201202_1sec_bert3/', '../IrisDataset/automatic_sumaries/20201202_1sec_word_2_vec/',
    #            '../IrisDataset/automatic_sumaries/20201217_1sec_bert/', '../IrisDataset/automatic_sumaries/20201217_1sec_bert2/', '../IrisDataset/automatic_sumaries/20201217_1sec_bert3/', '../IrisDataset/automatic_sumaries/20201217_1sec_word_2_vec/',
    #            '../IrisDataset/automatic_sumaries/20210309_1sec_bert/','../IrisDataset/automatic_sumaries/20210309_1sec_bert2/', '../IrisDataset/automatic_sumaries/20210309_1sec_bert3/', '../IrisDataset/automatic_sumaries/20210309_1sec_word_2_vec/'], '../IrisDataset/Sumarios/')

    box_plot_main(['../IrisDataset/rouge_scores/bert/','../IrisDataset/rouge_scores/bert2/','../IrisDataset/rouge_scores/bert3/', '../IrisDataset/rouge_scores/word2vec/'])






if __name__ == "__main__":
    main()
