
![[Attachments/Pasted image 20261030233517.png]]

Vẫn là cơ chế xác thực dùng JWT không có signature nên mình đổi sang người khác thoải mái:
![[Attachments/Pasted image 20261030233543.png]]

Bài này có vẻ bài này ko thể thắng do nhiều tiền được, mình để ý thấy cơ chể của log gửi đến endpoint API /api/audit để xem log người dùng:

![[Attachments/Pasted image 20261030233823.png]]


Mình thêm `| ls` thì tự nhiên thấy command injection luôn :))
![[Attachments/Pasted image 20261030234055.png]]


Mình cài reverse shell khai thác cho tiện:
