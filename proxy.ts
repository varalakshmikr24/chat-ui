// We are disabling the auth proxy to bypass login
export const proxy = () => {
  return null;
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};