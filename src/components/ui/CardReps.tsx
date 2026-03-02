export type CardRepsType = {
  full_name: string;
  rating: string;
  staff_id: string;
  completion_percentage: number;
};

export default function CardReps({
  full_name,
  rating,
  staff_id,
  completion_percentage,
}: CardRepsType) {
  const percentage = completion_percentage;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBarColor = (value: number) => {
    if (value >= 90) return "bg-green-600";
    if (value >= 75) return "bg-purple-500";
    if (value >= 60) return "bg-purple-400";
    return "bg-yellow-500";
  };

  const getRatingStyle = (r: string) => {
    const lower = r.toLowerCase();
    if (lower === "excellent")
      return "bg-green-600 text-white";
    if (lower === "good")
      return "bg-[#DCDCF5] text-purple-800";
    return "bg-[#EBEBFF] text-gray-600 border border-gray-300";
  };

  const getBarBg = (value: number) => {
    if (value >= 90) return "bg-green-100";
    return "bg-[#E0E0FF]";
  };

  return (
    <div className="bg-[#EBEBFF] w-full h-[100px] my-2 p-4 flex justify-between rounded-2xl items-center">
      <div className="flex justify-start items-center gap-3">
        <div className="w-[46px] h-[46px] bg-purple-700 flex justify-center text-white rounded-full items-center font-semibold text-sm">
          <p>{getInitials(full_name)}</p>
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-gray-800">{full_name}</h4>
          <p
            className={`px-3 py-1 w-fit text-center rounded-full text-xs font-medium ${getRatingStyle(rating)}`}
          >
            {rating}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-end justify-center">
        <h3 className="text-3xl font-bold text-gray-800">{percentage}%</h3>

        <div
          className={`${getBarBg(percentage)} h-[10px] w-[100px] rounded-full overflow-hidden`}
        >
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full ${getBarColor(percentage)}`}
          ></div>
        </div>
      </div>
    </div>
  );
}