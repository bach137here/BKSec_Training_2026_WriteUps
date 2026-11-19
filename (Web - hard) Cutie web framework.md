![Pasted image 20261113214634](Attachments/Pasted%20image%2020261113214634.png)	

API đề cho được xây dựng bằng framework ElysiaJS khá cute :D
Mình có vào website để tìm hiểu để hiểu vài syntax lạ:
![Pasted image 20261102210041](Attachments/Pasted%20image%2020261102210041.png)

![Pasted image 20261113215345](Attachments/Pasted%20image%2020261113215345.png)

Đọc source code mình thấy có adminPlugin và authPlugin với logic:

![Pasted image 20261113215552](Attachments/Pasted%20image%2020261113215552.png)

![Pasted image 20261113215631](Attachments/Pasted%20image%2020261113215631.png)


![Pasted image 20261113220100](Attachments/Pasted%20image%2020261113220100.png)

Khi mà đăng nhập được với tư cách admin thì sẽ đọc được secret qua /secrets.

Ở đây có một điểm đáng chú ý tại:
```javascript
const adminPlugin = new Elysia({ prefix: '/admin' })

```
prefix ở đây nghĩa là mọi endpoint được định nghĩa phía sau luôn phải thêm /admin vào.

Ví dụ mình muốn truy cập /auth/login thì sẽ phải vào /admin/auth/login.

Đọc thêm thì mình thấy nghi ngay lỗ hỏng SQL Injection qua unsafe():
![Pasted image 20261113220542](Attachments/Pasted%20image%2020261113220542.png)

Ứng dụng SELECT 2 trường username và role từ users. Mình hoàn toàn có thể chèn payload query tùy ý qua orderBy hoặc username.

https://elysiajs.com/plugins/graphql-yoga
Mình thử query qua đây endpoint /graphql:

![Pasted image 20261113222644](Attachments/Pasted%20image%2020261113222644.png)


![Pasted image 20261113223059](Attachments/Pasted%20image%2020261113223059.png)


Lúc này mình thử chèn payload lấy mật khẩu:
![Pasted image 20261113223325](Attachments/Pasted%20image%2020261113223325.png)

Oke lúc này mình đã có mật khẩu admin. Mọi chuyện sẽ không có gì nếu không có cái prefix /admin mình nói ở trước:))

Ở đây mình phải lấy session qua /admin/auth/login nhưng logic của API lại viết:

```javascript
const authPlugin = new Elysia({ name: 'auth' })
  .derive(({ headers }) => {
    const sessionId = headers['x-session-id']
    const session = sessionId ? sessions.get(sessionId) : null
    return { session }
  })
  .onBeforeHandle(({ session, path, set }) => {
    if (path === '/auth/login') return
    if (!session) {
      set.status = 401
      return { error: 'Unauthorized - Please login first' }
    }
  })
```

Quá ảo, đây là một bug của app hay sao ý. App chỉ cho auth qua /auth/login, so sánh cứng với endpoint này. Nhưng mình chỉ có thể truy cập /admin/auth/login do trước đó:

```javascript
const adminPlugin = new Elysia({ prefix: '/admin' })
  .use(authPlugin)
```

Không hiểu sao :)) Mình thử bypass một lúc, xem doc, source code của Framework về cái này nhưng chẳng thấy gì kì thật 🤔

Thế là mình quay lại SQLi mình tìm được hồi nãy và đọc được secret mà không cần đăng nhập luôn ảo thật :)) đúng là mới đầu overthinking quá

![Pasted image 20261113223951](Attachments/Pasted%20image%2020261113223951.png)

Không hiểu sao đây là một challenge hard ;----;


