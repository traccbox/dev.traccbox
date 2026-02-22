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
}) {
  const percentage = completion_percentage;

  console.log(staff_id);

  const [fName, lName] = full_name.split(" ");
  console.log(fName, "and", lName);

  const getColor = (value: number) => {
    if (value >= 80) return "bg-green-600";
    if (value >= 60) return "bg-blue-600";
    if (value >= 50) return "bg-orange-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-[#EBEBFF] w-full h-[100px] my-2 p-4 flex justify-between rounded-2xl items-center">
      <div className="flex justify-start items-center gap-3">
        <div className="w-[46px] h-[46px] bg-blue-950 flex justify-center text-white rounded-full items-center">
          <p>
            {fName[0]}
            {lName[0]}
          </p>
        </div>

        <div>
          <h4>{full_name}</h4>
          <p className="p-2 bg-black w-[100px] text-white text-center rounded-full text-xs tracking-widest font-medium">
            {rating}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-end justify-center">
        <h3 className="text-4xl">{percentage}%</h3>

        <div className="bg-[#E7FDE7] h-[10px] w-[100px] rounded-full overflow-hidden">
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full ${getColor(percentage)}`}
          ></div>
        </div>
      </div>
    </div>
  );
}
