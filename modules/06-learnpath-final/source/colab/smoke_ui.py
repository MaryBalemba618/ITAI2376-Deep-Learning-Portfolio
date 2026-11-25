"""Notebook button integration check. Mary Balemba | Group LearnPath | ITAI2376."""
import contextlib
import io
import json
from learnpath import Tutor
from learnpath.ui import launch
from pathlib import Path

def main():
    t=Tutor(seed=42)
    with contextlib.redirect_stdout(io.StringIO()):
        panel=launch(t)
    panel['start'].click()
    assert 'Your exercise' in panel['lesson'].value
    panel['answer'].value='-1'; panel['check'].click()
    assert 'does not match' in panel['result'].value
    panel['hint'].click(); assert 'Hint:' in panel['result'].value
    panel['answer'].value='sum(range(n))'; panel['check'].click()
    assert 'Correct.' in panel['result'].value
    panel['next'].click(); assert 'Your exercise' in panel['lesson'].value
    panel['nickname'].value='other'; panel['check'].click()
    assert 'Nickname changed' in panel['result'].value
    result={'group':'LearnPath','participants':['Mary Balemba'],'checks':6,'passed':6,
            'scope':'Programmatic widget button integration; not a Colab browser/visual test'}
    (Path(__file__).resolve().parent/'evidence/ui_smoke.json').write_text(json.dumps(result,indent=2))
    t.memory.close()
    print(json.dumps(result))

if __name__=='__main__': main()
