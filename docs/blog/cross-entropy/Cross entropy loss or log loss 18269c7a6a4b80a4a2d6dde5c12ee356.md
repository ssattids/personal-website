# Cross entropy loss or log loss

![image.png](Cross%20entropy%20loss%20or%20log%20loss/image.png)

example for binary classification:

- true probability: 1, predicted probability: 0.9
    - $-(1*log(0.9)) + 0 =0.10$
- true probability: 1, predicted probability: 0.1
    - $-(1*log_{10}(0.9)) + 0=2.30$
- true probability: 0, predicted probability 0.9
    - $0 -(log_{10}(1-0.9)) =2.3$
- true probability: 0, predicted probability 0.1
    - $0-(0*log_{10}(1-0.1))=0.10$

# Cross Entropy Loss for probability distributions

- True probability = 0.5, predicted probability = 0.5
    - $-(0.5*log(0.5)) + ((1-0.5)*log(1-0.5)))=0.693$
- True probability = 0.5, predicted probability = 0.1
    - $-(0.5*log(0.1)) + ((1-0.5)*log(1-0.1)))=1.203$
- True probability = 0.5, predicted probability = 0.9
    - $-(0.5*log(0.9)) + ((1-0.5)*log(1-0.9)))=1.203$