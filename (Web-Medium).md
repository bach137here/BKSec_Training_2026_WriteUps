


Mình không hiểu sao đây là Medium nữa🤔

Challenge đơn giản là một API có các route như sau:
![[Pasted image 20261021103454.png]]

![[Pasted image 20261021103538.png]]


Bài tập có cung cấp source code, cấu trúc như sau:
![[Pasted image 20261021103740.png]]
Challenge được viết bằng GO, cấu trúc code khá rõ ràng.

Flag nằm ở trong secret của admin:
![[Pasted image 20261021103917.png]]

Vậy để lấy flag thì mình nghĩ sẽ có 2 hướng chính chính là 
- Đăng nhập được vào tài khoản Admin
- Đọc được secret của admin


Mình đọc tiếp vào endpoint /signup
```go
func (h *SignUpHandler) Signup(c *gin.Context) {
	var signupData model.User

	if err := c.BindJSON(&signupData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"msg": "invalid json sent",
		})
		log.Println("error occured during read login JSON:", err)
		return
	}

	if signupData.Username == "" || signupData.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"msg": "username and password can not be left blank",
		})
		return
	}

	if signupData.Fullname == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"msg": "full name must be supplied",
		})
		return
	}

	insertUser := `INSERT INTO user (username, password, fullname, bio, secret, role) VALUES (?, ?, ?, ?, ?, ?)`

	_, err := h.DB.Exec(insertUser, signupData.Username, util.HashPassword(signupData.Password), signupData.Fullname, signupData.Biography, signupData.Secret, signupData.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"msg":          InternalSerErr,
			"msg_detailed": err.Error(),
		})
		return
	}
	log.Println("added user", signupData.Username)
}
```
Model User:
```go
package model

type User struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Fullname  string `json:"full_name"`
	Biography string `json:"bio"`
	Secret    string `json:"secret"`
	Role      string `json:"role"`
}

type ProfileResp struct {
	Username  string `json:"username"`
	Fullname  string `json:"full_name"`
	Biography string `json:"bio"`
	Role      string `json:"role"`
}

```

Các bạn có thể thấy, ở đây thì server khá bất cẩn khi nhận luôn 'role' trong input người dùng nếu có -> Mình có thể dễ dàng đăng kí một tài khoản với role=admin.

Mà như trong route các bạn đã biết, admin còn có một route cho phép đọc secret của mọi user chỉ cần thông qua id của họ -> Mình dễ dàng đọc được secret của admin từ đó đọc được Flag

![[Pasted image 20261021104549.png]]
```go
func (h *SecretHandler) GetSecret(id string) (*model.Secret, error) {
	secretResp := &model.Secret{Owner: id}

	sqlQuery := `select secret from user where id = ?`
	err := h.DB.QueryRow(sqlQuery, id).Scan(&secretResp.Secret)
	if err != nil {
		return nil, err
	}
	return secretResp, nil
}
```

**Solve**

Đầu tiên mình đăng kí một tài khoản với role admin:
![[Pasted image 20261021104754.png]]

Mình đăng nhập vào tài khoản vừa tạo và lấy được token:
![[Pasted image 20261021104900.png]]

Mình đăng nhập thành công
![[Pasted image 20261021105017.png]]


![[Pasted image 20261021105145.png]]

Và từ đó mình thành công đọc được Flag.