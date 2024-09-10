import Head from "next/head";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
    return (
        <>
            <Head>
                <title>Stars Centro FAG</title>
                <meta name="description" content="A Phaser 3 game Stars from Centro FAG" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <main className={` ${inter.className}`}>
                <AppWithoutSSR />
            </main>
        </>
    );
}
