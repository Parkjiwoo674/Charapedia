// 컨트롤러에서 던진 에러를 자동으로 next(err)로 넘겨서
// 매 함수마다 try/catch를 반복하지 않아도 되게 해주는 래퍼
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}