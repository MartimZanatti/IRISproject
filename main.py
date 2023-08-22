import os
from main_functions import  process_docx_file, create_stanza_sentences, summarization, pos_processing_paragraphs, process_sum_to_files, rouge_main, box_plot_main, box_plot_main_2, get_num_paragraphs
import torch
from emb_models import load_bert_model
from emb_models import load_word_2_vec

def main():


    torch.cuda.set_device(2)

    """
    model_name_bert = "rufimelo/bert-large-portuguese-cased-legal-tsdae-gpl-nli-sts-v0-assins"

    model = load_bert_model(model_name_bert)

    #model_name_word2vec = "word2vec.model"
    #model = load_word_2_vec(model_name_word2vec)

    path = '../IrisDataset/Acordaos/'
    path_done = '../IrisDataset/results_paper/rufimelobert-large-portuguese-cased-legal-tsdae-gpl-nli-sts-v0-assins/'
    files = os.listdir(path)
    files_done = os.listdir(path_done)
    for file_name in files:
        #print(file_name)
        if file_name not in files_done:
            doc = process_docx_file(path + file_name, preprocessing=True)
            doc = create_stanza_sentences(doc)
            scores, ids_dict = summarization(doc, model)

            num_sum = 0

            #paragraphs = pos_processing_paragraphs(doc.paragraphs, scores, ids_dict)

            "para efeitos de correr varios e po-los em ficheiros usar esta funcão"

            num_paragraphs = get_num_paragraphs(path + file_name)



            process_sum_to_files(doc.paragraphs, scores, ids_dict, file_name, num_paragraphs, path_done)






        """




    #rouge_main('../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae/', '../IrisDataset/Sumarios/', '../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae_rouge/')

    #box_plot_main(['../IrisDataset/results_paper/word_2_vec_with_pre_processing_rouge/','../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-mlm-sts-v0_rouge/', '../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae-sts-v0_rouge/', '../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae-gpl-nli-sts-v0_rouge/', '../IrisDataset/results_paper/bertimbau_rouge/', '../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae_rouge/', '../IrisDataset/results_paper/rufimelobert-large-portuguese-cased-legal-tsdae-gpl-v0_rouge/'])

    #box_plot_main_2(['../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae-gpl-nli-sts-v0_rouge/', '../IrisDataset/results_paper/stjirisbert-large-portuguese-cased-legal-tsdae-gpl-nli-sts-v0_no_preprocessing_rouge/'])





if __name__ == "__main__":
    main()
