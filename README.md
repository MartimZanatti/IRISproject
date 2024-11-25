
Models at: https://gitlab.com/diogoalmiro/iris-lfs-storage/

Running with python venv:

 - (install once:)
   - `python -m venv env`
   - `source env/bin/activate`
   - `pip install -U pip`
   - `pip install -r requirements.txt`
 - (running:)
   - `python server.py`

Running with docker:

 - (build once:)  `docker build .`
 - (running:) `docker run -it -p 8999:8999`


### Usage
 
 - After running server.py, go to http://127.0.0.1:8999 and insert a judgment (docx, txt or html). The judgment is divided into section (see this paper  https://link.springer.com/chapter/10.1007/978-3-031-73497-7_20).
 - The section Report, Facts and Law are used for summarization, and through lexRank, the most important paragraphs from the Law sections are returned
 - See function usage_one_doc from usage.py for a better understanding  

