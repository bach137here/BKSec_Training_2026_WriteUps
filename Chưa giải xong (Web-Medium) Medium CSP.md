
Bài này mình mở ticket nhờ các anh được các anh gợi ý mới giải được 😭 Suýt trầm cảm khi giải bài này 🤧

![[Pasted image 20261020202523.png]]

Mình check CSP thì thấy oke phết, nên chủ quan không xem kĩ bypass CSP và sau đó phải hối hận😭 
Cũng do là mình đã check kĩ rằng server không host JSONP hay AngularJS và ko có file JS đặc biệt nào ở client side🤔
![[Pasted image 20261020202908.png]]
Mình cũng check DOM XSS bằng extension của Burp nhưng cũng không thấy gì đặc biệt:
![[Pasted image 20261020204949.png]]




Lúc này mình thấy server có một cái khá lạ - xóa 'script' trong payload nếu xuất hiện:

![[Pasted image 20261020211656.png]]
![[Pasted image 20261020211715.png]]

Kết quả khi truyền scrscriptipt vào lại ra script :)) đến đây mình nghi nghi hướng này:
![[Pasted image 20261020211725.png]]

Thế là giờ mình chế được các script dạng như sau và đã redirect/ép bot gửi request về web




![[Pasted image 20261023110609.png]]


