import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Atlas | Student Growth OS', description: '학생의 성장을 관리합니다.' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ko"><body style={{margin:0,fontFamily:'Arial, sans-serif',background:'#f8fafc',color:'#0f172a'}}>{children}</body></html>}
