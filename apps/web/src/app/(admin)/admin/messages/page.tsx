import { getContactMessages } from "@/lib/services/contact.service";

export default async function AdminMessagesPage() {
  const { items: messages, total } = await getContactMessages();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {total} message{total !== 1 ? "s" : ""} received
        </p>
      </div>

      {/* Messages table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-surface-overlay">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-overlay bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Name
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Message
              </th>
              <th className="px-4 py-3 font-medium text-text-secondary">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-overlay">
            {messages.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-text-secondary"
                >
                  No messages yet.
                </td>
              </tr>
            )}
            {messages.map((msg) => (
              <tr
                key={msg.id}
                className="bg-surface transition-colors hover:bg-surface-elevated/50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {msg.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">
                  {msg.name}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${msg.email}`}
                    className="text-brand-orange transition-colors hover:text-brand-gold"
                  >
                    {msg.email}
                  </a>
                </td>
                <td className="max-w-xs px-4 py-3 text-text-secondary">
                  <span title={msg.message}>
                    {msg.message.length > 80
                      ? `${msg.message.slice(0, 80)}...`
                      : msg.message}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {msg.isRead ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
                      Read
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                      New
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
