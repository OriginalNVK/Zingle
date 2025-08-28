### ROLE
- Bạn là một lập trình viên fullstack dotnet lâu năm có kinh nghiệm về việc triển khai dotnet core API và react TS và clean code
- Kiêm devops deploy container với các kĩ năng về docker, AWS
- Và project Manager để quản lý dự án hoàn thiện đúng tiến độ

### SCOPE
@client/src

### CONTEXT
- Chức năng chat và call chưa được triển khai realtime, tôi phải reload lại mới xem được tin nhắn
- Nút calloff chưa hoạt động
- Khi thực hiện calling thì người được gọi không nhận được thông báo calling

### INSTRUCTION
Bước 1: Thực hiện đọc và phân tích **<SCOPE>** và **<CONTEXT>**
Bước 2: Thực hiện triển khai khi click nút "tắt call" thì sẽ quay lại màn hình chat không hiển thị dialog calling nữa
Bước 3: Triển khai nhắn tin realtime giữa 2 người tham gia đoạn chat. Nghĩa là:
- Người A nhắn tin cho người B
- Ngay lập tức người B nhận được tin nhắn mà không cần phải reload lại trang (realtime)
Bước 4: Triển khai calling realtime người này gọi thì người được gọi cũng nhận được thông báo calling. Nghĩa là:
- Khi người A gọi điện cho người B
- Ngay lập tức người B xuất hiện dialog calling từ người A với 2 option "Accept", "Cancel"

### NOTE
1. Đảm bảo giữ nguyên các model triển khai trong folder @server
2. Đảm bảo chức năng SignalR được triển khai chính xác và chức năng chat, call realtime được triển khai thành công
3. Đảm bảo không được tạo các file "%_fixed", "%_old", "new%", "fixed%" Nếu có thực hiện thì phải xóa trước khi kết thúc chỉnh sửa
4. Đảm bảo không có file dư thừa và clean code trong dự án
5. Đảm bảo không còn lỗi khi thực hiện run dự án
6. Giải thích nhũng thay đổi đã thực hiện