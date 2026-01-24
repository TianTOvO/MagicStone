import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Empty component
export function Empty() {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-gray-400")} onClick={() => toast('Coming soon')}>
      <i className="fas fa-box-open text-5xl mb-4"></i>
      <p className="text-xl">暂无内容</p>
      <p className="text-sm mt-2">敬请期待</p>
    </div>
  );
}