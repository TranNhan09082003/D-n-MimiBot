import CommandsPreview from "@/components/CommandsPreview";

export const metadata = {
  title: "Danh Sách Lệnh — Mimi Discord Music Bot",
  description: "Tra cứu toàn bộ danh sách lệnh Slash Commands của Mimi Bot kèm cú pháp và phân quyền.",
};

export default function CommandsPage() {
  return (
    <div className="pt-32 pb-20">
      <CommandsPreview />
    </div>
  );
}
