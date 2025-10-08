"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";

const transferSchema = z.object({
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  wallet: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Solana wallet address"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export function TransferForm({ className }: { className?: string }) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [solToUsdcRate, setSolToUsdcRate] = useState<number | null>(null);
  const [showUsdc, setShowUsdc] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      wallet: "",
    },
  });

  useEffect(() => {
    const fetchSolToUsdcRate = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        );
        setSolToUsdcRate(response.data.solana.usd);
      } catch (error) {
        console.error("Error fetching SOL to USDC rate:", error);
      }
    };

    fetchSolToUsdcRate();
  }, []);

  const onSubmit = async (values: TransferFormValues) => {
    if (!connected || !publicKey) return;

    try {
      toast("Processing transaction...");
      const recipient = new PublicKey(values.wallet);
      const lamports = Math.floor(values.amount * 1_000_000_000);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports,
        }),
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Transaction successful!");
      form.reset();
    } catch (err: any) {
      toast.error(`Transaction failed: ${err.message}`);
      console.error(err);
    }
  };

  return (
    <div className={className}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send SOL</CardTitle>
          <CardDescription>
            Fill in the amount and recipient wallet address
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 w-full max-w-md">
          {!connected ? (
            <div className="flex justify-center">
              <WalletMultiButton className="w-full max-w-xs" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 w-full"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (SOL)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>Amount of SOL to send</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Solana wallet address"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Recipient&apos;s Solana wallet address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showUsdc"
                    checked={showUsdc}
                    onChange={() => setShowUsdc(!showUsdc)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="showUsdc" className="text-sm">
                    Show equivalent in USDC
                  </label>
                </div>

                {showUsdc && solToUsdcRate && (
                  <div className="mt-2 text-sm">
                    Equivalent:{" "}
                    {(form.watch("amount") * solToUsdcRate).toFixed(2)} USDC
                  </div>
                )}

                <Button type="submit" className="mt-2">
                  Send SOL
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
