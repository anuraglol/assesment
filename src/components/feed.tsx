"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FC, useEffect, useState } from "react";

interface Entry {
  name: string;
  symbol: string;
  uri: string;
  mint: string;
}

interface FeedData {
  entries: Entry[];
}

export const Feed: FC = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<"open" | "closed" | "error">("closed");

  const { data } = useQuery<FeedData>({
    queryKey: ["feed"],
    initialData: { entries: [] },
    queryFn: async () => ({
      entries: [
        {
          name: "Example Token",
          symbol: "EXT",
          uri: "https://example.com/token-metadata.json",
          mint: "ExampleMintAddress1234567890",
        },
      ],
    }),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const useQuerySubscription = () => {
    useEffect(() => {
      const websocket = new WebSocket("ws://localhost:8080/connect");

      websocket.onopen = () => {
        setState("open");
        console.log("connected to websocket ✅");
      };

      websocket.onmessage = (event) => {
        try {
          const message: Entry = JSON.parse(event.data);

          queryClient.setQueryData<FeedData>(["feed"], (old) => ({
            entries: [message, ...(old?.entries ?? [])],
          }));
        } catch (err) {
          console.error("failed to parse websocket message", err);
        }
      };

      websocket.onerror = (err) => {
        setState("error");
        console.error("websocket error", err);
      };

      websocket.onclose = () => {
        setState("closed");
        console.log("websocket closed ❌");
      };

      return () => {
        websocket.close();
      };
    }, [queryClient]);
  };

  useQuerySubscription();

  return (
    <div className="w-full flex flex-col gap-6 items-center justify-center">
      <p>WebSocket status: {state}</p>
      <div className="flex flex-col items-center gap-4">
        {data?.entries.map((entry, index) => (
          <div
            key={`${entry.mint}-${index}`}
            className="flex flex-row items-center gap-3"
          >
            {">"}
            <div className="w-full flex flex-col sm:flex-row items-center gap-4 max-w-xl">
              <div className="flex flex-col items-center sm:items-start">
                <h2 className="text-[15px] font-medium">
                  {entry.name} | {entry.symbol}
                </h2>
                <p className="text-xs break-all">Mint: {entry.mint}</p>
                <a
                  href={entry.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline break-all"
                >
                  Metadata URI: {entry.uri}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
