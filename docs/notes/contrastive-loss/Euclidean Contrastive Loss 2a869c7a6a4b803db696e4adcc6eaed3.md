# Euclidean Contrastive Loss

## Example: More complex contrastive Loss Function

Example:

The MathML expression

$$
\mathcal{L}_\text{cont}(\mathbf{x}_i, \mathbf{x}_j, \theta) = \mathbb{1}[y_i=y_j] \| f_\theta(\mathbf{x}_i) - f_\theta(\mathbf{x}_j) \|^2_2 + \mathbb{1}[y_i\neq y_j]\max(0, \epsilon - \|f_\theta(\mathbf{x}_i) - f_\theta(\mathbf{x}_j)\|_2)^2
$$

defines a **contrastive loss function**, commonly used in metric learning to bring similar samples closer together and push dissimilar samples farther apart in the embedding space. Here's a breakdown of each component:

1. The contrastive loss function takes 2 vector xi and xj and network theta

$$
{L}_\text{cont}(\mathbf{x}_i, \mathbf{x}_j, \theta)
$$

1. These are indicator functions that evaluate to 1 if the classes for xi and xj are the the same inside is true, otherwise 0

$$
\mathbb{1}[y_i = y_j] \\and \\{1}[y_i \neq y_j]:
$$

1. Euclidean distance

$$
\| f_\theta(\mathbf{x}_i) - f_\theta(\mathbf{x}_j) \|_2^2
$$

1. For points that have the same class we want them to be close together:

$$
\mathbb{1}[y_i = y_j]\| f_\theta(\mathbf{x}_i) - f_\theta(\mathbf{x}_j) \|_2^2
$$

- This always takes into account the distance of two points that have the same class - the larger the distance the larger the loss and vice versa which is exactly what we want
1. For points that don’t have the same class we want them to be further apart:

$$
\max(0, \epsilon - \|f_\theta(\mathbf{x}_i) - f_\theta(\mathbf{x}_j)\|_2)^2
$$

- We only take into their loss into account if they are ***close*** to each other as shown by the examples table below. When they are far apart we get no loss contribution, when they are closer together we get a bigger loss contribution, which is exactly what we want