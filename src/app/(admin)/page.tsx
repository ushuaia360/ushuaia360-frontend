import PageHeader from "@/components/admin/page-header";
import DashboardStatsCards from "@/components/admin/dashboard-stats-cards";
import RecentTrailsList from "@/components/admin/recent-trails-list";
import TrailCommentsList from "@/components/admin/trail-comments-list";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Home" />
      <div className="p-8 space-y-6">

        {/* Stats */}
        <DashboardStatsCards />

        {/* Recent trails */}
        <RecentTrailsList />

        {/* Comments per trail */}
        <TrailCommentsList />

      </div>
    </div>
  );
}
