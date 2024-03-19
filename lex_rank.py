import numpy as np
from scipy.sparse.csgraph import connected_components
import torch
import torch.nn as nn


def degree_centrality_scores(
        similarity_matrix,
        threshold=None,
        increase_power=True,
):
    if not (
            threshold is None
            or isinstance(threshold, float)
            and 0 <= threshold < 1
    ):
        raise ValueError(
            '\'threshold\' should be a floating-point number '
            'from the interval [0, 1) or None',
        )

    if threshold is None:
        markov_matrix = create_markov_matrix(similarity_matrix)
        # print("markov_matrix", markov_matrix )

    else:
        markov_matrix = create_markov_matrix_discrete(
            similarity_matrix,
            threshold,
        )

    scores = stationary_distribution(
        markov_matrix,
        increase_power=increase_power,
        normalized=False,
    )

    return scores


def _power_method(transition_matrix, increase_power=True):
    eigenvector = np.ones(len(transition_matrix))

    if len(eigenvector) == 1:
        return eigenvector

    transition = transition_matrix.transpose()

    while True:
        eigenvector_next = np.dot(transition, eigenvector)

        if np.allclose(eigenvector_next, eigenvector):
            return eigenvector_next

        eigenvector = eigenvector_next

        if increase_power:
            transition = np.dot(transition, transition)


def connected_nodes(matrix):
    _, labels = connected_components(matrix)

    groups = []

    for tag in np.unique(labels):
        group = np.where(labels == tag)[0]
        groups.append(group)

    return groups


def create_markov_matrix(weights_matrix):
    n_1, n_2 = weights_matrix.shape
    if n_1 != n_2:
        raise ValueError('\'weights_matrix\' should be square')

    row_sum = weights_matrix.sum(axis=1, keepdims=True)

    return weights_matrix / row_sum


def create_markov_matrix_discrete(weights_matrix, threshold):
    discrete_weights_matrix = np.zeros(weights_matrix.shape)
    ixs = np.where(weights_matrix >= threshold)
    discrete_weights_matrix[ixs] = 1

    return create_markov_matrix(discrete_weights_matrix)


def graph_nodes_clusters(transition_matrix, increase_power=True):
    clusters = connected_nodes(transition_matrix)
    clusters.sort(key=len, reverse=True)

    centroid_scores = []

    for group in clusters:
        t_matrix = transition_matrix[np.ix_(group, group)]
        eigenvector = _power_method(t_matrix, increase_power=increase_power)
        centroid_scores.append(eigenvector / len(group))

    return clusters, centroid_scores


def stationary_distribution(
        transition_matrix,
        increase_power=True,
        normalized=True,
):
    n_1, n_2 = transition_matrix.shape
    if n_1 != n_2:
        raise ValueError('\'transition_matrix\' should be square')

    distribution = np.zeros(n_1)

    # print("distribution", distribution)

    grouped_indices = connected_nodes(transition_matrix)

    # print("grouped_indices", grouped_indices)

    for group in grouped_indices:
        t_matrix = transition_matrix[np.ix_(group, group)]
        # print("t_matrix", t_matrix)
        eigenvector = _power_method(t_matrix, increase_power=increase_power)
        # print("eigenvector", eigenvector)
        distribution[group] = eigenvector
        # print("distribution[group]", distribution[group])

    if normalized:
        distribution /= n_1

    return distribution


# function added by me

def lex_rank_emb(emb, cont=None):
    similarity_matrix = torch.empty(len(emb), len(emb))  # similarity between paragraphs
    cos = nn.CosineSimilarity(dim=0, eps=1e-8)

    for i, p in enumerate(emb):
        for j, p2 in enumerate(emb):
            similarity_matrix[i, j] = cos(p, p2)

    # calculate the scores of each sentence via lexRank algorithm
    if cont:
        scores = degree_centrality_scores(similarity_matrix, threshold=None)
    else:
        scores = degree_centrality_scores(similarity_matrix, threshold=0.5)

    top_n_idx = np.argsort(scores)

    scores = np.sort(scores)

    scores = np.flip(scores)

    top_n_idx = np.flip(top_n_idx)

    return top_n_idx, scores



















