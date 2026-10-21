import { tooltipPositionsData } from "@/app/(with-layouts)/ui-elements/tooltips/_components/data";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tailgrids/core/tooltip";

export default function TooltipsPositions() {
  return (
    <div className="flex gap-10">
      {tooltipPositionsData.map((item) => (
        <Tooltip key={item.id} placement={item.position}>
          <TooltipTrigger>{item.title}</TooltipTrigger>

          <TooltipContent>
            <p className="text-sm">This is a tooltip</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
