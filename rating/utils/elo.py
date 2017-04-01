def expected(A, B):
    """
    Calculate expected score of A in a match against B
    :param A: Elo rating for player A
    :param B: Elo rating for player B
    """
    return 1 / (1 + 10 ** ((B - A) / 400))


def elo(old, exp, score, k=32):
    """
    Calculate the new Elo rating for a player
    :param old: The previous Elo rating
    :param exp: The expected score for this match
    :param score: The actual score for this match
    :param k: The k-factor for Elo (default: 32)
    """
    return old + k * (score - exp)

def new_ratings(p1_r, p2_r, p1_wins):
    exp_p1_win = expected(p1_r, p2_r)
    exp_p2_win = expected(p2_r, p1_r)

    score = [0 , 1]
    if p1_wins:
        score = [1, 0]

    return [elo(p1_r, exp_p1_win, score[0]), elo(p2_r, exp_p2_win, score[1])]
