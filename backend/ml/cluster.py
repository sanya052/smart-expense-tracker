import numpy as np

def run_clustering(user_id, conn):
    """
    Runs KMeans clustering on user's expenses.
    Labels each expense row with a spending pattern cluster.
    Requires at least 3 expenses to cluster.
    """
    rows = conn.execute(
        "SELECT id, amount, category FROM expenses WHERE user_id = ?",
        (user_id,)
    ).fetchall()

    if len(rows) < 3:
        return  # not enough data

    # Encode categories numerically
    categories = list({r["category"] for r in rows})
    cat_map = {c: i for i, c in enumerate(categories)}

    X = np.array([[r["amount"], cat_map[r["category"]]] for r in rows], dtype=float)

    # Normalize
    X_norm = X.copy()
    for col in range(X.shape[1]):
        col_range = X[:, col].max() - X[:, col].min()
        if col_range > 0:
            X_norm[:, col] = (X[:, col] - X[:, col].min()) / col_range

    # Determine k (max 3)
    k = min(3, len(rows))

    # KMeans from scratch (simple Lloyd's algorithm)
    np.random.seed(42)
    idx = np.random.choice(len(X_norm), k, replace=False)
    centroids = X_norm[idx].copy()

    for _ in range(100):
        dists = np.array([[np.linalg.norm(x - c) for c in centroids] for x in X_norm])
        labels = np.argmin(dists, axis=1)
        new_centroids = np.array([
            X_norm[labels == i].mean(axis=0) if (labels == i).any() else centroids[i]
            for i in range(k)
        ])
        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids

    # Assign human-readable cluster names based on avg amount
    cluster_avgs = {i: X[labels == i, 0].mean() for i in range(k) if (labels == i).any()}
    sorted_clusters = sorted(cluster_avgs, key=cluster_avgs.get)

    label_names = {sorted_clusters[0]: "Low Spend", sorted_clusters[-1]: "High Spend"}
    if k == 3:
        label_names[sorted_clusters[1]] = "Mid Spend"

    for i, row in enumerate(rows):
        cluster_label = label_names.get(labels[i], f"Cluster {labels[i]}")
        conn.execute(
            "UPDATE expenses SET cluster_label = ? WHERE id = ?",
            (cluster_label, row["id"])
        )

    conn.commit()
