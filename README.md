
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
