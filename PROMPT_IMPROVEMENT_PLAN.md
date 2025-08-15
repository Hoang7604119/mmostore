# Prompt cải tiến trải nghiệm người dùng (UX) cho site market

## Mục tiêu
- Loại bỏ các nhược điểm về UX khi filter, phân trang, realtime, cache, loading sản phẩm.
- Đảm bảo hệ thống đồng bộ, tránh lỗi race condition, mất đồng bộ dữ liệu giữa client và backend.

---

## MCP (Main Control Points)
1. **Debounce & Filter Control**
   - MCP: Chỉ gửi request filter/search sau khi người dùng dừng thao tác 300-500ms.
   - MCP: Không gửi request nếu giá trị filter không thay đổi.
   - MCP: Khi loading, giữ lại dữ liệu cũ, chỉ loading phần mới.

2. **Client-side Caching**
   - MCP: Sử dụng SWR/React Query để cache dữ liệu sản phẩm theo filter/page.
   - MCP: Prefetch trang tiếp theo khi gần cuộn tới cuối trang.
   - MCP: Cache các filter phổ biến, invalidate cache khi có thay đổi từ backend.

3. **Realtime Update**
   - MCP: Sử dụng Supabase để nhận event cập nhật sản phẩm mới/hết hàng.
   - MCP: Khi nhận event, chỉ update đúng sản phẩm thay đổi, không reload toàn bộ.
   - MCP: Đảm bảo đồng bộ trạng thái giữa nhiều tab/browser.

4. **Ảnh & Loading**
   - MCP: Dùng ảnh placeholder mặc định, lazy load ảnh sản phẩm.
   - MCP: Skeleton UI cho từng card sản phẩm khi loading.

5. **UX/UI Controls**
   - MCP: Giữ vị trí cuộn khi quay lại trang trước.
   - MCP: Loading nhỏ, không che toàn bộ grid.
   - MCP: Filter dạng side panel/dropdown, thao tác nhanh.

6. **Backend API**
   - MCP: API trả về trường lastUpdated, client chỉ refetch khi có thay đổi.
   - MCP: API hỗ trợ infinite scroll, trả về suggestion khi không có sản phẩm phù hợp.

---

## Rules (Quy tắc đồng bộ & kiểm soát lỗi)

1. **Luôn kiểm tra trạng thái filter, page, cache trước khi gửi request mới.**
2. **Khi nhận dữ liệu realtime, so sánh với cache hiện tại, chỉ update khi có thay đổi.**
3. **Invalidate cache đúng lúc (khi có event realtime hoặc thao tác mua hàng thành công).**
4. **Không update state khi component đã unmount (tránh memory leak, lỗi đồng bộ).**
5. **Luôn kiểm tra trạng thái loading trước khi cho phép thao tác tiếp theo (tránh double request).**
6. **Khi có lỗi API hoặc socket, hiển thị thông báo rõ ràng, không reload UI đột ngột.**
7. **Đảm bảo mọi thao tác update state đều qua 1 luồng chính (ví dụ: chỉ update qua React Query/SWR mutation, không update trực tiếp).**
8. **Khi có nhiều tab/browser, ưu tiên đồng bộ qua event realtime, không rely vào cache cũ.**
9. **Kiểm tra kỹ các trường hợp race condition: filter liên tục, mua hàng đồng thời, reload tab.**
10. **Viết test cho các luồng đồng bộ dữ liệu (unit test, integration test, e2e test).**

---

## Lưu ý triển khai
- Ưu tiên trải nghiệm người dùng: mọi thay đổi phải mượt, không gây nhấp nháy, không mất dữ liệu tạm thời.
- Đảm bảo đồng bộ dữ liệu giữa client và backend, tránh trường hợp hiển thị sai trạng thái sản phẩm.
- Khi refactor, kiểm tra kỹ các hook, state, cache, socket để tránh lỗi đồng bộ.
- Ghi chú rõ các MCP và rules trong codebase, review kỹ khi merge PR.

---

> **Lưu ý:**
> - Khi triển khai các cải tiến này, luôn kiểm tra kỹ đồng bộ dữ liệu, tránh race condition, memory leak, hoặc lỗi state không nhất quán.
> - Đảm bảo mọi thành viên team đều hiểu rõ MCP và rules trước khi code/merge.
> - **Sau khi hoàn thành cải tiến, cần kiểm tra và xóa toàn bộ code, file, logic cũ không còn sử dụng để dọn rác hệ thống, tránh lỗi double, lỗi đồng bộ hoặc bug phát sinh do dư thừa.**

