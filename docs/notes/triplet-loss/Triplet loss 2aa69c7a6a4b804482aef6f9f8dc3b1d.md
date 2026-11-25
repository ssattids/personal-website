# Triplet loss

## The Triplet Loss Mechanism

For each training example, you need three items:

1. **Anchor**: A user
2. **Positive**: A video they liked/watched
3. **Negative**: A video they didn't engage with

The loss function:

```python
L = max(0, margin + d(user, pos_video) - d(user, neg_video))
```

This says: "The distance to the positive video should be smaller than the distance to the negative video by at least `margin`."

## The Computation Flow for a two towers approach

The **same VideoTower** processes both the positive and negative videos. You're not training two separate towers - you have:

- 1 UserTower
- 1 VideoTower (used twice per triplet)

So in a single forward pass:

1. UserTower runs once (on the user)
2. VideoTower runs twice (on positive video, then negative video)
3. You get 3 embeddings total
4. Compute 2 distances
5. Calculate loss

For each triplet (user, positive_video, negative_video):

**Step 1: Generate embeddings through the towers (python pseudocode)**

```python
user_embedding = UserTower(user_features)            # Shape: [embedding_dim]
pos_video_embedding = VideoTower(pos_video_features) # Shape: [embedding_dim]
neg_video_embedding = VideoTower(neg_video_features) # Shape: [embedding_dim]
```

**Step 2: Compute distances (python pseudocode)**

```python
d_positive = distance(user_embedding, pos_video_embedding)   # Scalar
d_negative = distance(user_embedding, neg_video_embedding)   # Scalar

# or
# distance is negative dot product (so smaller = more similar):
d_positive = -dot(user_embedding, pos_video_embedding)
d_negative = -dot(user_embedding, neg_video_embedding)
```

**Step 2: Calculate loss (python pseudocode)**

```python
# calculate loss
L = max(0, margin + d_positive - d_negative) # d_positive should be minimized, and d_negative should be maximized

# autograd
L.backwards()
```

## 

## Batching in Practice

In reality, you process multiple triplets in a batch

Here is an example where the batch size is N=100 and the dimension vector is 128

https://docs.pytorch.org/docs/stable/generated/torch.nn.TripletMarginLoss.html

```python
triplet_loss = nn.TripletMarginLoss(margin=1.0, p=2, eps=1e-7)
anchor = torch.randn(100, 128, requires_grad=True)
positive = torch.randn(100, 128, requires_grad=True)
negative = torch.randn(100, 128, requires_grad=True)
output = triplet_loss(anchor, positive, negative)
output.backward()
```