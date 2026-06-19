import random

def run_clustering(user_id, conn):
    rows = conn.execute('SELECT id, amount, category FROM expenses WHERE user_id = ?', (user_id,)).fetchall()
    if len(rows) < 3:
        return
    amounts = [r['amount'] for r in rows]
    min_a = min(amounts)
    max_a = max(amounts)
    range_a = max_a - min_a if max_a != min_a else 1
    norm = [(r['id'], (r['amount'] - min_a) / range_a) for r in rows]
    k = min(3, len(rows))
    random.seed(42)
    centroids = [norm[i][1] for i in random.sample(range(len(norm)), k)]
    for _ in range(100):
        clusters = [[] for _ in range(k)]
        for rid, val in norm:
            closest = min(range(k), key=lambda i: abs(val - centroids[i]))
            clusters[closest].append((rid, val))
        new_centroids = []
        for i in range(k):
            if clusters[i]:
                new_centroids.append(sum(v for _, v in clusters[i]) / len(clusters[i]))
            else:
                new_centroids.append(centroids[i])
        if all(abs(new_centroids[i] - centroids[i]) < 0.0001 for i in range(k)):
            break
        centroids = new_centroids
    sorted_idx = sorted(range(k), key=lambda i: centroids[i])
    labels = {}
    if k == 1:
        labels[sorted_idx[0]] = 'Low Spend'
    elif k == 2:
        labels[sorted_idx[0]] = 'Low Spend'
        labels[sorted_idx[1]] = 'High Spend'
    else:
        labels[sorted_idx[0]] = 'Low Spend'
        labels[sorted_idx[1]] = 'Mid Spend'
        labels[sorted_idx[2]] = 'High Spend'
    for i in range(k):
        for rid, _ in clusters[i]:
            conn.execute('UPDATE expenses SET cluster_label = ? WHERE id = ?', (labels[i], rid))
    conn.commit()
