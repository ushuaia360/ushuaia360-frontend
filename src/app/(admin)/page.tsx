import PageHeader from "@/components/admin/page-header";
import DashboardStatsCards from "@/components/admin/dashboard-stats-cards";
import RecentTrailsList from "@/components/admin/recent-trails-list";
import TrailCommentsList from "@/components/admin/trail-comments-list";
import { DashboardStatsProvider } from "@/contexts/dashboard-stats-context";

export default function DashboardPage() {
  return (
    <DashboardStatsProvider>
      <div>
        <PageHeader title="Home" />
        <div className="p-8 space-y-6">
          <DashboardStatsCards />

          <RecentTrailsList />

          <TrailCommentsList />
        </div>
      </div>
    </DashboardStatsProvider>
  );
}
