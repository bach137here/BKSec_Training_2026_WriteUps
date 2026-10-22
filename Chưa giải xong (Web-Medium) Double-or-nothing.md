


![[Pasted image 20261022205326.png]]

Chỉ cần cược được 9 điểm là win nhưng cơ chế của bài không cho phép số coin vượt quá 4, video mình spam cược:

![[2026-10-22 14-12-25.mp4]]

mình đã thử các cách gian lận như:
- Đặt cược > số tiền có
- Đặt cược số âm
- Gửi object... trong đó có payload NoSQL injection như `{"$ne"="..."}, {"$where"="..."},...`hay là prototype pollution như `{"__proto__"="..."}` tất cả đều khong được
- Đổi định dạng body ko được
- Gửi string dạng "1iyqweiuqwyeui7126474" thì có vẻ server ép kiểu ra 1, nhưng "1e3217489" lại không được -> chứng tỏ server ép số nguyên.
- Gửi array kiểu [1] vẫn được bình thường, server chỉ quan tâm số đầu, ví dụ [1,4,1,56,7] -> coi như 1 nhưng gửi [9999,1,1,1,1] thì ko được
- Gửi nhiều attribute tên "amount" không được,...
![[Pasted image 20261022141505.png]]


Sau đó mình có thử Race Condition bằng cách gửi một lúc 20 request nhưng có vẻ server handle đúng cách
![[Pasted image 20261022145543.png]]


Ngoài ra mình cũng thử gửi thập phân nhưng không thế nào lên được 9 dù đã dùng AI slop ra 100 cái script khác nhau và tối ưu các kiểu
![[Pasted image 20261022145853.png]]


Đến đây mình nghĩ brute-force có vẻ không khả thi nên mình đã quay sang dùng ffuf dò tất cả các endpoint, endpoint API, query param, header,... nhưng đều không tìm thấy gì???
